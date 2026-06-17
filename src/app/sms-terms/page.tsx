import type { Metadata } from "next";
import { LegalPage } from "@/components/Legal";
import { LEGAL } from "@/lib/legal";
export const metadata: Metadata = { title: "SMS Program Terms — Office Pick'em League" };
const C = LEGAL.companyName;
export default function SmsTerms() {
  return <LegalPage title="SMS Program Terms" sections={[
    { p: [`These terms govern the Office Pick'em League text-message (SMS) program, operated by ${C}.`] },
    { h: "Program description", p: [`When you opt in, we send recurring automated text messages related to the league you joined: a welcome message, weekly game-line summaries, pick confirmations, reminders to submit picks, and weekly results. You can also text commands such as LINES, MY PICKS, STANDINGS, SCORE, and HELP.`] },
    { h: "How you opt in", p: [`Enter your name and mobile number on our enrollment page at officepickemleague.com and check the box agreeing to receive recurring automated texts, or text JOIN to our number. Consent is not a condition of any purchase.`] },
    { h: "Message frequency", p: [`Message frequency varies — typically about 1–4 messages per week during the season, plus messages you trigger by texting a command.`] },
    { h: "Cost", p: [`Message and data rates may apply, depending on your carrier and plan. Office Pick'em League does not charge a fee for the messages.`] },
    { h: "Opt out and help", p: [`Reply STOP at any time to stop all messages (you may also text STOPALL, UNSUBSCRIBE, CANCEL, END, or QUIT). Reply START to opt back in. Reply HELP for help, or contact ${LEGAL.email}.`] },
    { h: "Carriers", p: [`Supported carriers include major U.S. carriers (AT&T, Verizon, T-Mobile, and others). Carriers are not liable for delayed or undelivered messages.`] },
    { h: "Privacy", p: [`We do not sell or share your mobile number or text-message consent with third parties for their marketing. See our Privacy Policy at officepickemleague.com/privacy.`] },
  ]} />;
}
