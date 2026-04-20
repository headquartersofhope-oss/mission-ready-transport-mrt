# STANDING INSTRUCTION FOR ALL FUTURE APPS
## RE Jones Global Ecosystem Standard

**Effective Date:** April 20, 2026  
**Authority:** Rodney Jones, RE Jones Global Super Admin  
**Status:** Non-Negotiable, Mandatory at Launch

---

## THE RULE

**Every new app built in the RE Jones Global ecosystem must include the AI Assistant package at launch.**

This is not optional. This is not "nice to have." This is the standard configuration for all apps going forward.

---

## MANDATORY COMPONENTS AT BUILD TIME

1. **Floating AppAssistant Button**
   - Position: Fixed bottom-right corner
   - Color: App's primary accent color (electric blue #3B82F6 for MRT)
   - Icon: MessageCircle (lucide-react)
   - Size: 56px × 56px
   - Shadow: Premium elevation

2. **Claude Bridge with Brief Function**
   - "Brief Claude" button: Opens Claude.ai with full brief context pre-loaded
   - "Copy Full Brief" button: Copies complete report to clipboard
   - Brief message format: "I am Rodney Jones, super admin of RE Jones Global. Here is my [APP_NAME] live report as of [ISO_TIMESTAMP]."
   - Include: All critical operational metrics, alerts, status summaries

3. **Floating Training Button** (Optional but Recommended)
   - Documentation/help toggle accessible from main interface

4. **Backend AI Function** (`aiAssistant.js`)
   - Connected to Claude API
   - Authenticates user via `base44.auth.me()`
   - Pulls live system data via entity queries
   - Returns: `briefSummary` (role-based short version) + `fullBrief` (complete report)

5. **System Context Function**
   - Pulls the most relevant live data for that app type
   - Examples:
     - Transportation: Active rides, driver status, vehicle fleet, incidents
     - E-commerce: Orders pending, inventory status, revenue metrics
     - Healthcare: Patient queue, appointment status, resource utilization
   - Updates in real-time on every brief generation

6. **Role-Based Prompt Chips**
   - Suggested prompts customized to user role
   - Dispatcher: "Today's rides," "Unassigned rides," "Driver status"
   - Super Admin: "Full dispatch report," "Fleet status," "Health check"
   - Manager: App-appropriate quick-access queries

7. **Developer Mode Toggle** (Super Admin Only)
   - Shows raw metrics, query timing, data sources
   - Useful for debugging and performance optimization

8. **README Installation Guide**
   - Documentation for any future developers
   - Explains: Component hierarchy, data sources, Claude integration, customization

---

## IMPLEMENTATION CHECKLIST

- [ ] Create `components/ai/AppAssistant.jsx` (floating button + panel UI)
- [ ] Create `functions/aiAssistant.js` (backend data aggregator)
- [ ] Import AppAssistant into main Layout component
- [ ] Define `systemContextFn` pulling live data
- [ ] Configure role-based prompt chips
- [ ] Style button in app's primary color
- [ ] Test Brief Claude button flow
- [ ] Test Copy Full Brief clipboard function
- [ ] Add to App.jsx routes if needed
- [ ] Create README_AI_ASSISTANT.md in project root

---

## BENEFITS

✅ **Instant Executive Briefing** - One-click report for any app  
✅ **Role-Based Intelligence** - Context adapts to dispatcher, manager, super admin  
✅ **Live Data** - Always reflects current system state  
✅ **Claude Integration** - Seamless handoff to Claude AI for deeper analysis  
✅ **Consistency** - Every app has the same professional interface  
✅ **Scalability** - Works across entire RE Jones Global ecosystem  

---

## PERMANENT PROTOCOL

From this point forward, **every app you build will have AI eyes built in from day one.**

This is the RE Jones Global standard. No exceptions.

**Rodney Jones can be briefed on any app instantly with one click.**

---

## CUSTOMIZATION PER APP

While the framework is standard, each app customizes:
- **App name** in brief header
- **Primary color** of floating button
- **System context** (what data to pull)
- **Prompt chips** (role-appropriate suggestions)
- **Metrics** (operational KPIs relevant to that app)

---

**Status:** ✅ **CONFIRMED STANDING REQUIREMENT**