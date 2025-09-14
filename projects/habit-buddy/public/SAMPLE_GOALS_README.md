# Sample Goals for HabitBuddy

This directory contains sample habit data that you can import into your HabitBuddy application to test features and see how the app works with different types of goals.

## 📁 Available Sample Files

### 1. `sample-goals.json` - Standard Goals
A balanced set of 8 common habits with varying progress levels:
- **Morning Meditation** (30 days, 5 check-ins)
- **Drink 8 Glasses of Water** (21 days, 7 check-ins)
- **Read for 30 Minutes** (50 days, 12 check-ins)
- **Exercise for 45 Minutes** (30 days, 5 check-ins)
- **Practice Gratitude Journal** (21 days, 11 check-ins)
- **Learn Spanish** (100 days, 18 check-ins)
- **No Social Media Before 9 AM** (30 days, 4 check-ins)
- **Take 10,000 Steps** (21 days, 8 check-ins)

### 2. `sample-goals-advanced.json` - Comprehensive Goals
A more diverse set of 10 habits with different categories and emojis:
- **🌅 Morning Sunlight Exposure** (30 days, 20 check-ins)
- **💪 Strength Training** (50 days, 10 check-ins)
- **📚 Read Technical Books** (100 days, 22 check-ins)
- **🥗 Eat 5 Servings of Vegetables** (21 days, 6 check-ins)
- **🧘‍♀️ 10-Minute Meditation** (30 days, 11 check-ins)
- **📝 Daily Journaling** (50 days, 25 check-ins)
- **🎸 Practice Guitar** (100 days, 20 check-ins)
- **😴 Sleep by 11 PM** (30 days, 8 check-ins)
- **📞 Call Family Member** (7 days, 3 check-ins)

### 3. `sample-goals-beginner.json` - Simple Starter Goals
Perfect for testing with minimal complexity:
- **Make Bed Every Morning** (7 days, 3 check-ins)
- **Drink Water First Thing** (7 days, 3 check-ins)
- **Take a 5-Minute Walk** (7 days, 2 check-ins)

## 🚀 How to Import Sample Goals

### Method 1: Using the App Interface
1. Open your HabitBuddy application
2. Click the **"Import JSON"** button in the sidebar
3. Select one of the sample JSON files
4. Click **"Open"** to import the habits
5. You'll see a success message and be redirected to the Goals page

### Method 2: Manual Import (Advanced)
1. Copy the contents of a sample JSON file
2. Paste it into a new file and save with `.json` extension
3. Use the app's import functionality to load the file

## 📊 What You'll See After Import

### Goals Page
- All imported habits will appear as habit cards
- Progress bars showing completion percentage
- Streak information and statistics
- Check-in buttons for today's habits

### Calendar Page
- Visual representation of all check-ins
- Color-coded dots for each habit
- Ability to view individual habit calendars

### Stats Page
- Completion percentages and averages
- Weekly trend charts
- Habit-specific statistics

### Reminders Page
- All habits with reminder settings
- Reminder time and frequency information
- Ability to edit reminder settings

## 🎯 Testing Different Scenarios

### Test Import Functionality
- Try importing different sample files
- Test with invalid JSON to see error handling
- Verify data persistence after page refresh

### Test Reminder System
- Check notification permissions
- Verify reminder times and frequencies
- Test reminder window functionality

### Test Check-in System
- Add new check-ins for today
- Verify streak calculations
- Test anti-cheat features

### Test Export Functionality
- Export your current habits
- Compare exported data with original
- Test importing exported data

## 🔧 Customizing Sample Goals

You can modify the sample files to test specific scenarios:

### Change Habit Properties
- Modify `title` to test different habit names
- Adjust `daysTarget` for different goal lengths
- Change `color` for visual customization
- Update `categoryId` for different categories

### Modify Check-ins
- Add or remove check-in dates
- Change check-in hash values
- Test different date patterns

### Adjust Reminders
- Modify `time` for different reminder schedules
- Change `days` array for different frequencies
- Adjust `window` for different reminder windows

## 📝 Sample Data Structure

Each habit follows this structure:
```json
{
  "id": "unique-habit-id",
  "title": "Habit Name",
  "daysTarget": 30,
  "categoryId": "30",
  "color": "#10B981",
  "createdAt": "2024-01-01",
  "checkIns": {
    "2024-01-01": "hash-value",
    "2024-01-02": "hash-value"
  },
  "reminder": {
    "time": "09:00",
    "days": [1, 2, 3, 4, 5],
    "window": 30
  }
}
```

## 🚨 Important Notes

- Sample data uses realistic date ranges (January 2024)
- All check-in hashes are placeholder values
- Habit IDs are unique across all sample files
- Colors are chosen for good visual distinction
- Reminder times are set for reasonable hours

## 🎉 Enjoy Testing!

These sample goals should give you a comprehensive view of how HabitBuddy works with real habit data. Try importing different sets to see various scenarios and test all the app's features!
