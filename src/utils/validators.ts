import dayjs from 'dayjs';
import { messages } from '../constants/messages';
import type { TripFormInput } from '../types';

export function required(value: string, field: string) {
  if (!value.trim()) throw new Error(field + '不能为空');
  return value.trim();
}

export function validateTripForm(form: TripFormInput) {
  const errors: Partial<Record<keyof TripFormInput, string>> = {};
  if (!form.title.trim()) errors.title = messages.titleRequired;
  if (!form.destination.trim()) errors.destination = messages.destinationRequired;
  if (!form.start_date || !form.end_date) {
    errors.start_date = messages.dateRangeRequired;
  } else if (dayjs(form.end_date).isBefore(dayjs(form.start_date), 'day')) {
    errors.end_date = messages.dateRangeInvalid;
  }
  if (!Number.isFinite(form.budget) || form.budget < 0) errors.budget = messages.budgetInvalid;
  return errors;
}
