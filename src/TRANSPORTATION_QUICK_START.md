# HOH Transportation Dispatch — Quick Start Guide

## 🚀 First-Time Setup (5 Minutes)

### Step 1: Verify Data
1. Go to **System Health** (`/diagnostics`)
2. Click **"Run Full Transportation Diagnostic"**
3. Wait for results (all green = ready to dispatch)

### Step 2: Key Roles
- **Dispatcher** → Access `/dispatch-board` (main operations hub)
- **Driver** → Access `/driver-board` (personal schedule)
- **Admin** → Access everything + setup

### Step 3: Start a Route

1. **Dispatch Board** → Select date (top right)
2. **Unassigned rides** appear in time blocks or by driver
3. For each ride:
   - **Manual assign:** Click ride → select driver + vehicle → **Apply**
   - **AI assign:** Click ride → click **AI Assign** button (1 click)
4. Verify conflicts (yellow warning) → resolve or override
5. Click **"Mark as Scheduled"** (requires driver + vehicle + time)

---

## 🎯 Common Workflows

### Workflow: Group Nearby Riders

1. **Dispatch Board** → Click **"Grouping"** button (top right)
2. Review grouping opportunities (e.g., "3 riders, same pickup location")
3. Manually group by selecting same driver for those rides
4. Click **"Lock Route"** (when grouped)

**System Tip:** Grouping saves ~10-20 min per additional rider on same route.

---

### Workflow: Check Driver Schedule

1. **Dispatch Board** → Click **"By Driver"** tab
2. See each driver's ride list
3. Click any ride to see full details
4. Check for conflicts (red warning = overlapping pickups)

---

### Workflow: Monitor Live Operations

1. **Dispatch Board** → Click **"Live / Active"** filter
2. See all rides currently in progress
3. Monitor by time block or driver view
4. Click ride to update status:
   - En Route → Rider Picked Up → Dropped Off → Complete

**Driver side:** Drivers see status buttons on their `/driver-board`

---

### Workflow: Find Problem Rides

1. **Dispatch Board** → Look for **"MISSING"** badges:
   - Red badge = No driver OR no vehicle OR no pickup time
2. Click ride → expand → add missing info
3. Once complete → status updates automatically

---

## 📊 Operations Intelligence

### 1. System Health Check
**Path:** `/diagnostics`  
**What it shows:**
- Dispatch readiness (unassigned rides, conflicts)
- Assignment quality (overloaded drivers)
- Route quality (timing issues)
- Notification status
- GPS tracking (ready for integration)
- Overall "Ready for Live Dispatch" flag

**Action:** Run before each shift. Fix red issues before going live.

---

### 2. AI Demand Scaling
**Path:** `/ai-intelligence` → **"Demand Scaling"** tab  
**What it shows:**
- How your fleet handles 10, 20, 30... 80 rides/day
- When the system breaks (breaking point)
- How many drivers & vehicles you need
- Cost per ride at scale
- Risk summary

**Action:** Use to plan hiring/fleet growth.

---

### 3. Operational Summary Report
**Path:** Call `operationalSummaryReport` function  
**What it shows:**
- Completion rate %
- No-show rate %
- Cancellation rate %
- Driver performance (load, on-time %)
- Vehicle utilization
- Cost analysis
- Recommendations

**Action:** Review weekly to spot trends.

---

## 🔧 Manual Assignments (When AI Doesn't Recommend)

**When to use manual:**
- Low-confidence AI score (< 50%)
- Special rider requests
- Preferred driver relationships
- Complex multi-stop routes

**How to assign:**
1. Click ride → scroll to **"Assign"** section
2. Select driver dropdown
3. Select vehicle dropdown
4. Click **"Apply"** (or **"Force Assign"** if conflict)

---

## 📱 Driver Communication

### What Drivers Receive (When Configured)
- ✅ Ride approved notification
- ✅ Driver assigned notification
- ✅ "Driver is on the way" alert
- ✅ "Arriving soon" countdown
- ✅ Completion confirmation

**Current Status:** Message templates ready, SMS/email provider integration pending.

**To Enable:** Contact admin to set up Twilio (SMS) or SendGrid (Email).

---

## 🔴 Red Flags to Watch

| Flag | Meaning | Action |
|------|---------|--------|
| Unassigned Ride | No driver yet | Use AI Assign or manual assignment |
| Conflict Warning | Driver has ride 90min before/after | Resolve (reassign or confirm) |
| MISSING badge | Incomplete ride | Add driver, vehicle, or time |
| High Load (9+ rides) | Driver overbooked | Distribute to another driver |
| No-Show Rate > 10% | Riders not showing up | Implement reminders or follow-up |

---

## 🚗 Scaling Your Operation

### Growing from 10 to 30 Rides/Day
1. Dispatch Board stays manageable
2. Add 1 driver (now 2-3 total)
3. Can share vehicles (no new ones needed yet)
4. AI grouping saves time on routing

### Growing from 30 to 80 Rides/Day
1. Need 3-4 drivers minimum
2. Need 2 vehicles minimum
3. Enable route optimization (GroupedRoute)
4. Add reminders & notifications
5. Use demand scaling simulator to plan exactly

**Use the Demand Scaling tool** (`/ai-intelligence` → **Demand Scaling** tab) to test your fleet size.

---

## ⚙️ Admin Setup Tasks

### First-Time Admin
1. [ ] Verify all drivers have **Linked User Email** set
2. [ ] Verify participants have **Phone** numbers (for SMS)
3. [ ] Verify participants have **Email** (for email notifications)
4. [ ] Run `/diagnostics` → confirm green
5. [ ] Train dispatchers on AI Assign & Grouping
6. [ ] Test a manual ride assignment end-to-end

### Ongoing Maintenance
- Daily: Run `/diagnostics` before shift
- Weekly: Review operational summary report
- Monthly: Check driver on-time rates & no-show trends
- Quarterly: Use demand scaling simulator for hiring plans

---

## 🎓 Feature Deep Dives

### Auto-Assignment (AI Assign)
**Scoring factors (highest score wins):**
- No time conflicts → +0 (baseline)
- Preferred rider → +20 bonus
- Same service area → +15 bonus
- High on-time rate → +10%
- Low current load → +5
- On duty right now → +10

**Score threshold:** 75+ = auto-assign (no conflict), 50-74 = recommendation, <50 = manual review

---

### Route Optimization
**For grouped rides, system:**
1. Orders pickups earliest-first
2. Orders dropoffs earliest-deadline-first (avoid late arrivals)
3. Calculates estimated route time
4. Flags on-time risk (low/medium/high)

**Result:** Rides completed on time, dead-head time minimized.

---

### Grouping Opportunities
**Types detected:**
1. **Same Pickup Location** → riders leaving from same house/building
2. **Same Destination** → multiple riders to same employer/training site
3. **Return Trip Cluster** → riders returning at same time

**Savings:** ~10-20 min per additional rider grouped.

---

## 📞 Troubleshooting

### "AI Assign didn't work"
- Check driver status (must be active, available, license valid)
- Check vehicle status (must be active, available)
- Check for time conflict (ride within 90 min of another ride)
- Try manual assignment or different driver

### "Ride won't mark as scheduled"
- Missing driver? → Assign one
- Missing vehicle? → Assign one
- Missing pickup time? → Add time
- Once all 3 complete → status auto-updates

### "Driver showing overload"
- Switch to "By Driver" view
- Reassign ride to different driver with lower load
- Or add more drivers if consistently overloaded

### "System not ready for live dispatch"
1. Run `/diagnostics`
2. Fix all red issues (unassigned rides, conflicts)
3. Resolve warnings if possible
4. Re-run diagnostics → should show green

---

## 💡 Pro Tips

1. **AI + Manual = Faster:** Use AI to suggest, dispatcher to verify
2. **Group Early:** Grouping saves time when routes overlap
3. **Check Conflicts Daily:** 90-min window prevents driver stress
4. **Monitor Load:** Drivers >8 rides = fatigue risk
5. **Test Scaling:** Use demand simulator quarterly
6. **Automate Reminders:** Set up 24-hr notifications when ready

---

## 🆘 Need Help?

- **System Health:** `/diagnostics` → Run diagnostic (tells you what's wrong)
- **Dispatch Issues:** `/ai-intelligence` → Dispatch Assistant
- **Driver Performance:** `/drivers` → See on-time rates & incident count
- **Rider History:** `/participants` → See no-show pattern

---

**Status: 🟢 Ready for Live Dispatch**  
**Last Updated:** 2026-04-15  
**Questions?** Check `TRANSPORTATION_APP_UPGRADE_SUMMARY.md` for full technical details.