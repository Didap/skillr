export interface InterviewEvent {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  date: Date;
  maxSlots: number;
  format: string | null;
  meetingLink: string | null;
  createdAt: Date | null;
  bookingCount?: number;
}

export interface InterviewBooking {
  id: string;
  eventId: string;
  professionalId: string;
  status: 'booked' | 'cancelled' | 'completed' | null;
  createdAt: Date | null;
}
