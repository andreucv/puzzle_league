# Cron jobs in project

## 1. Auto transtition competition status to cancelled

For those competitions that have been not started (this is the ones that the organizer has not started any category) and their end date is in the past, we want to automatically transition their status to cancelled. This is to avoid having competitions that are already ended but still in pending status.

This cron job should run daily at midnight. It should go for all competitions that are in pending status and have end date in the past, and transition their status to cancelled.

This needs to be a vercel cron job that runs a serverless function. The function should be idempotent, meaning that if it runs multiple times, it should not cause any issues. The function should also log the competitions that were transitioned to cancelled for auditing purposes.

