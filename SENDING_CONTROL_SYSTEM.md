# 🎛️ Sending Control System - Complete Guide

## ✅ What's Been Implemented

A complete sending control system that allows you to:
- **Start/Stop/Pause/Resume** automated sending
- **Configure cadence** (delays, breaks, working hours, daily limits)
- **View queue status** in real-time
- **Manually trigger** sending batches
- **Monitor sending progress** with live statistics

## 🎯 Features

### 1. **Sending Control Tab** (Admin Dashboard)
- New "Sending" tab in admin dashboard
- Real-time status display (Running/Paused/Stopped)
- Session statistics (messages sent today, this session)
- Queue status (ready to send, pending, skipped)

### 2. **Control Buttons**
- **Start Sending**: Begin automated sending process
- **Stop Sending**: Stop all automated sending
- **Pause Sending**: Temporarily pause (can resume later)
- **Resume Sending**: Resume from pause

### 3. **Settings Configuration**
- **Delay Settings**:
  - Human Mode (60-210 seconds random) or Custom delay
  - Delay variation (±%)
- **Break Settings**:
  - Coffee break interval (every N messages)
  - Coffee break duration (minutes)
  - Long break interval (every N messages)
  - Long break duration (minutes)
- **Working Hours**:
  - Enable/disable working hours restriction
  - Start time / End time
- **Contact Frequency**:
  - Minimum days between contacts
- **Daily Limits**:
  - Maximum messages per day
- **Channels**:
  - Enable/disable WhatsApp
  - Enable/disable Email

### 4. **Manual Triggers**
- **Process Queue Now (10 messages)**: Process 10 messages immediately
- **Process Queue Now (50 messages)**: Process 50 messages immediately

### 5. **Queue Status Display**
- Ready to send count
- Total pending count
- Remaining daily quota
- Skipped reasons (too recent, weekend, outside hours)
- Weekend/working hours warnings

## 📋 Database Schema

### `sending_settings` Table
Stores cadence configuration:
- Delay settings (human mode, delay, variation)
- Break settings (coffee/long break intervals and durations)
- Working hours (enabled, start/end time, timezone)
- Contact frequency (days between contacts)
- Daily limits (max messages, warning threshold)
- Channel settings (WhatsApp/Email enabled)

### `sending_control_state` Table
Tracks current sending session:
- Control state (is_running, is_paused, paused_until)
- Session stats (started_at, ended_at, messages_sent_today, messages_sent_session)
- Active settings reference
- Filters (sdr_id, campaign_id)
- Last activity (last_message_sent_at, last_error)

## 🔌 API Endpoints

### `/api/admin/sending/control`
- **GET**: Get current sending control state
- **POST**: Start/Stop/Pause/Resume sending
  ```json
  {
    "action": "start" | "stop" | "pause" | "resume",
    "pauseDuration": 3600  // Optional: seconds for pause
  }
  ```

### `/api/admin/sending/settings`
- **GET**: Get all sending settings
- **POST**: Create new settings
- **PUT**: Update existing settings (query param: `?id=...`)

### `/api/admin/sending/queue`
- **GET**: Get queue status and statistics
  - Returns: ready to send, total pending, skipped reasons, daily counts

## 🚀 How to Use

### Step 1: Run Migration
```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/016_sending_control.sql
```

### Step 2: Configure Settings
1. Go to Admin Dashboard → **Sending** tab
2. Click **Settings** button
3. Configure:
   - Delays between messages
   - Break intervals and durations
   - Working hours
   - Daily limits
   - Contact frequency
4. Click **Save Settings**

### Step 3: Start Sending
1. Click **Start Sending** button
2. System will begin processing queue automatically
3. Monitor progress in real-time

### Step 4: Monitor & Control
- View queue status (ready, pending, skipped)
- See daily/session message counts
- Pause if needed (e.g., for breaks)
- Stop when done

### Step 5: Manual Triggers (Optional)
- Use "Process Queue Now" buttons for immediate processing
- Useful for testing or urgent sends

## 📊 Real-Time Updates

The dashboard automatically refreshes every 10 seconds to show:
- Current sending state
- Queue status
- Message counts
- Last activity

## ⚙️ Settings Integration

When you start sending:
1. System loads active settings from database
2. If no settings exist, uses defaults
3. Settings apply to all automated sending
4. Can be changed anytime (affects next session)

## 🔄 Workflow

```
1. Configure Settings (optional - uses defaults if not set)
   ↓
2. Click "Start Sending"
   ↓
3. System processes queue with configured cadence
   ↓
4. Monitor progress in real-time
   ↓
5. Pause/Resume as needed
   ↓
6. Stop when done
```

## 🎛️ Control Options

### Start Sending
- Begins automated processing
- Uses active settings from database
- Respects all restrictions (weekends, working hours, contact frequency)

### Stop Sending
- Stops all automated sending
- Ends current session
- Can restart anytime

### Pause Sending
- Temporarily pauses (can resume)
- Useful for breaks or manual review
- Can set pause duration

### Resume Sending
- Resumes from pause
- Continues with same session stats

## 📈 Queue Status Explained

- **Ready to Send**: Contacts that passed all checks (scheduled time, contact frequency, day-of-week, working hours)
- **Total Pending**: All contacts with status='pending' and scheduled_send_at <= now
- **Remaining Today**: Daily limit - messages sent today
- **Skipped**:
  - **Too Recent**: Contacted within minimum days
  - **Weekend**: Saturday/Sunday (skipped completely)
  - **Outside Hours**: Outside configured working hours

## 🔧 Advanced Configuration

### Custom Settings Per Campaign
You can create multiple settings profiles and select which one to use when starting.

### Filtered Sending
When starting, you can optionally filter by:
- SDR ID (only send for specific SDR)
- Campaign ID (only send for specific campaign)

## 📝 Notes

- Settings are stored in database and persist across sessions
- Only one sending session can be active at a time
- All restrictions (weekends, working hours, contact frequency) are enforced
- Manual triggers bypass some restrictions (for urgent sends)
- Real-time updates refresh every 10 seconds

## 🚨 Important

1. **Run the migration** before using: `supabase/migrations/016_sending_control.sql`
2. **Default settings** are created automatically on first run
3. **Settings apply** to all automated sending (email and WhatsApp)
4. **Manual sends** (admin clicking Email button) bypass automated cadence

---

## ✅ Status

All features implemented and ready to use! 🎉
