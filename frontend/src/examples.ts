import type { TrialRequest } from './types';

export const examples: Array<{ id: string; label: string; payload: TrialRequest }> = [
  {
    id: 'campus-event',
    label: '校园活动文案',
    payload: {
      original_text:
        '本周五晚上七点，我们将在大学生活动中心举办春日社团开放夜。现场有音乐表演、手作体验和社团招新咨询，欢迎同学们前来参加，认识更多朋友，了解丰富的校园生活。',
      target_platform: 'campus',
      audience: '大一新生和想加入社团的同学',
      objective: 'interest',
      intensity: 'balanced',
    },
  },
  {
    id: 'course-intro',
    label: '课程介绍文案',
    payload: {
      original_text:
        '这门课程将带你学习AI工具的基础使用方法，包括提示词编写、资料整理和内容改写。适合没有技术基础但想提高学习效率的同学，通过案例练习掌握日常学习中可直接使用的方法。',
      target_platform: 'wechat',
      audience: '想提升学习效率的大学生',
      objective: 'clarity',
      intensity: 'safe',
    },
  },
];
