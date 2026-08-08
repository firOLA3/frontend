'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { participantsApi } from '@/lib/api';
import type { CreateParticipantData, UpdateParticipantData, Participant } from '@/types';
import toast from 'react-hot-toast';

interface ParticipantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Participant | null;
  mode: 'create' | 'edit';
}

export function ParticipantForm({ isOpen, onClose, onSuccess, initialData, mode }: ParticipantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateParticipantData | UpdateParticipantData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        reset({
          name: initialData.name,
          email: initialData.email || '',
          phone: initialData.phone || '',
        });
      } else {
        reset({ name: '', email: '', phone: '' });
      }
    }
  }, [isOpen, isEdit, initialData, reset]);

  const onSubmit = async (data: CreateParticipantData | UpdateParticipantData) => {
    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        await participantsApi.update(initialData._id, data as UpdateParticipantData);
        toast.success('Participant updated successfully');
      } else {
        const response = await participantsApi.create(data as CreateParticipantData);
        if (response.emailError) {
          toast.error(`Participant created, but email failed: ${response.emailError}`, { duration: 5000 });
        } else {
          toast.success('Participant created successfully');
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Participant' : 'Add Participant'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="John Doe"
          {...register('name', {
            required: 'Name is required',
            maxLength: { value: 100, message: 'Name too long' },
          })}
          error={errors.name?.message}
          autoFocus
        />

        <Input
          label="Email (optional)"
          type="email"
          placeholder="john@example.com"
          {...register('email', {
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Invalid email format',
            },
          })}
          error={errors.email?.message}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="+1 234 567 890"
          {...register('phone')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}