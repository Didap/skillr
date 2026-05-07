export interface InterviewEvent {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  topic?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
  location?: string | null;
  date: Date;
  startTime?: Date | null;
  endTime?: Date | null;
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
