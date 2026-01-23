import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { StudentProgress } from '../entities/StudentProgress';
import { TimeTracking } from '../entities/TimeTracking';
import { User } from '../entities/User';

@Injectable()
export class ProgressService {
  constructor(private readonly em: EntityManager) {}

  async getStudentsProgressForOrg(orgId: number) {
    const students = await this.em.find(User, {
      organization: orgId,
      role: 'STUDENT',
    });
    const progress = await this.em.find(StudentProgress, {
      student: { $in: students.map((s) => s.id) },
    });
    return progress.map((p) => ({
      studentId: p.student.id,
      studentEmail: p.student.email,
      completionPercentage: p.completionPercentage,
    }));
  }

  async getOrgProgressSummary(orgId: number) {
    const students = await this.em.find(User, {
      organization: orgId,
      role: 'STUDENT',
    });
    const studentIds = students.map((s) => s.id);

    const progress = await this.em.find(StudentProgress, {
      student: { $in: studentIds },
    });
    const timeTracking = await this.em.find(TimeTracking, {
      student: { $in: studentIds },
    });

    const totalStudents = students.length;
    const avgCompletion =
      progress.length > 0
        ? progress.reduce((sum, p) => sum + p.completionPercentage, 0) /
          progress.length
        : 0;
    const totalTime = timeTracking.reduce((sum, t) => sum + t.minutesSpent, 0);

    // Monthly, yearly, overall
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyTime = timeTracking
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() + 1 === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.minutesSpent, 0);

    const yearlyTime = timeTracking
      .filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.minutesSpent, 0);

    return {
      totalStudents,
      averageCompletionPercentage: avgCompletion,
      totalTimeSpentMinutes: totalTime,
      monthlyTimeSpentMinutes: monthlyTime,
      yearlyTimeSpentMinutes: yearlyTime,
    };
  }

  async getStudentProgress(studentId: number) {
    const progress = await this.em.findOne(StudentProgress, {
      student: studentId,
    });
    const timeTracking = await this.em.find(TimeTracking, {
      student: studentId,
    });

    const totalTime = timeTracking.reduce((sum, t) => sum + t.minutesSpent, 0);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyTime = timeTracking
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() + 1 === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.minutesSpent, 0);

    const yearlyTime = timeTracking
      .filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.minutesSpent, 0);

    return {
      completionPercentage: progress?.completionPercentage || 0,
      totalTimeSpentMinutes: totalTime,
      monthlyTimeSpentMinutes: monthlyTime,
      yearlyTimeSpentMinutes: yearlyTime,
    };
  }
}
