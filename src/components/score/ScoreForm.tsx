import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form } from 'antd';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '../forms/FormInput';
import { FormTextarea } from '../forms/FormTextarea';

const scoreSchema = z.object({
  score1: z.string().min(1, 'Vui lòng nhập điểm'),
  score2: z.string().min(1, 'Vui lòng nhập điểm'),
  score3: z.string().min(1, 'Vui lòng nhập điểm'),
  totalScore: z.string().min(1, 'Vui lòng nhập điểm'),
  comments: z.string().min(1, 'Vui lòng nhập nhận xét'),
  questions: z.string().optional(),
});

type ScoreFormFields = z.infer<typeof scoreSchema>;

export interface ScoreFormValues {
  score1: number;
  score2: number;
  score3: number;
  totalScore: number;
  comments: string;
  questions?: string;
}

interface ScoreFormProps {
  initialValues?: Partial<ScoreFormValues>;
  submitLabel?: string;
  loading?: boolean;
  showQuestions?: boolean;
  onSubmit: (values: ScoreFormValues) => void | Promise<void>;
}

const defaultValues: ScoreFormValues = {
  score1: 0,
  score2: 0,
  score3: 0,
  totalScore: 0,
  comments: '',
  questions: '',
};

export function ScoreForm({
  initialValues,
  submitLabel = 'Lưu điểm',
  loading,
  showQuestions = false,
  onSubmit,
}: ScoreFormProps) {
  const { control, handleSubmit, reset, formState } = useForm<ScoreFormFields>({
    resolver: zodResolver(scoreSchema),
    mode: 'onChange',
    defaultValues: {
      score1: String(initialValues?.score1 ?? defaultValues.score1),
      score2: String(initialValues?.score2 ?? defaultValues.score2),
      score3: String(initialValues?.score3 ?? defaultValues.score3),
      totalScore: String(initialValues?.totalScore ?? defaultValues.totalScore),
      comments: initialValues?.comments ?? defaultValues.comments,
      questions: initialValues?.questions ?? defaultValues.questions,
    },
  });

  useEffect(() => {
    reset({
      score1: String(initialValues?.score1 ?? defaultValues.score1),
      score2: String(initialValues?.score2 ?? defaultValues.score2),
      score3: String(initialValues?.score3 ?? defaultValues.score3),
      totalScore: String(initialValues?.totalScore ?? defaultValues.totalScore),
      comments: initialValues?.comments ?? defaultValues.comments,
      questions: initialValues?.questions ?? defaultValues.questions,
    });
  }, [initialValues, reset]);

  function submitForm(values: ScoreFormFields) {
    onSubmit({
      score1: Number(values.score1),
      score2: Number(values.score2),
      score3: Number(values.score3),
      totalScore: Number(values.totalScore),
      comments: values.comments,
      questions: values.questions,
    });
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(submitForm)}>
      <FormInput control={control} name="score1" label="Tiêu chí 1" />
      <FormInput control={control} name="score2" label="Tiêu chí 2" />
      <FormInput control={control} name="score3" label="Tiêu chí 3" />
      <FormInput control={control} name="totalScore" label="Tổng điểm" />
      <FormTextarea control={control} name="comments" label="Nhận xét" />
      {showQuestions ? (
        <FormTextarea control={control} name="questions" label="Câu hỏi" />
      ) : null}
      <Button
        type="primary"
        htmlType="submit"
        loading={loading}
        disabled={!formState.isValid}
      >
        {submitLabel}
      </Button>
    </Form>
  );
}
