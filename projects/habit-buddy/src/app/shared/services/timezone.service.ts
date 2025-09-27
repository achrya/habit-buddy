import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private readonly timezone: string;

  constructor() {
    this.timezone = environment.timezone;
  }

  /**
   * Get current date in the configured timezone
   */
  getCurrentDate(): Date {
    return new Date();
  }

  /**
   * Get today's date string in YYYY-MM-DD format in the configured timezone
   */
  getTodayString(): string {
    return this.formatDateString(this.getCurrentDate());
  }

  /**
   * Format a date to YYYY-MM-DD string in the configured timezone
   */
  formatDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Format a date to time string in HH:mm format in the configured timezone
   */
  formatTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Get current time in minutes since midnight in the configured timezone
   */
  getCurrentTimeInMinutes(): number {
    const now = this.getCurrentDate();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Get current weekday (0 = Sunday, 1 = Monday, etc.) in the configured timezone
   */
  getCurrentWeekday(): number {
    return this.getCurrentDate().getDay();
  }

  /**
   * Convert HH:mm string to minutes since midnight
   */
  timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to HH:mm string
   */
  minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get the timezone being used
   */
  getTimezone(): string {
    return this.timezone;
  }

  /**
   * Calculate days between two dates
   */
  daysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Add days to a date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtract days from a date
   */
  subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  /**
   * Get date string for yesterday
   */
  getYesterdayString(): string {
    return this.formatDateString(this.subtractDays(this.getCurrentDate(), 1));
  }

  /**
   * Get date string for tomorrow
   */
  getTomorrowString(): string {
    return this.formatDateString(this.addDays(this.getCurrentDate(), 1));
  }

  /**
   * Check if a date string is today
   */
  isToday(dateString: string): boolean {
    return dateString === this.getTodayString();
  }

  /**
   * Check if a date string is yesterday
   */
  isYesterday(dateString: string): boolean {
    return dateString === this.getYesterdayString();
  }
}
