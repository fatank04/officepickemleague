import type { Metadata } from "next";
import { LegalPage } from "@/components/Legal";
import { LEGAL } from "@/lib/legal";
export const metadata: Metadata = { title: "Terms of Service — Office Pick'em League" };
const C = LEGAL.companyName;
export default function Terms() {
  return <LegalPage title="Terms of Service" sections={[
    { p: [`These Terms of Service ("Terms") are an agreement between you and ${C} ("Office Pick'em League," "we," "us") governing your use of our website, web app, text-message (SMS), and phone (voice) services (the "Service"). By creating or joining a league, making picks, or otherwise using the Service, you agree to these Terms. If you do not agree, do not use the Service.`] },
    { h: "1. What the Service is — and is not", p: [`Office Pick'em League is a free, skill-based prediction game in which participants predict outcomes of professional football games (winner, point spread, over/under). The Service is not gambling, betting, or a wagering platform. Participants never pay money to enter or play; no money is collected, pooled, or paid out by us; and we do not accept wagers.`] },
    { h: "2. Eligibility", p: [`You must be at least 18 years old. The Service is intended for employees and members of an organization (a "League") that has set up Office Pick'em League for its group, and for the individual who administers that League (the "Commissioner").`] },
    { h: "3. Accounts, PINs, and security", p: [`You provide your name and (optionally) a mobile number, and set a 4-digit PIN. You are responsible for keeping your PIN confidential and for activity under your account.`] },
    { h: "4. Prizes are provided by the League — not by us", p: [`Any prize or reward in a League is decided, funded, and awarded solely by the Commissioner or the organization running the League. We do not provide, fund, hold, or award prizes and are not a party to any prize arrangement. Any tax or reporting obligation for a prize is the responsibility of the awarding organization and/or the recipient. We are a software facilitator only.`] },
    { h: "5. Acceptable use", p: [`You agree not to use the Service for any unlawful purpose or to facilitate gambling; manipulate scoring, standings, or another participant's account; access the Service by automated means except as permitted; or disrupt the Service. We may suspend access for violations.`] },
    { h: "6. Text messages and phone calls", p: [`If you opt in, you may receive recurring automated text messages and may interact with the Service by phone, governed also by our SMS Program Terms and Privacy Policy. Message and data rates may apply. Reply STOP to opt out of texts at any time.`] },
    { h: "7. Intellectual property", p: [`The Service and its software, design, and content (excluding League names/logos provided by a Commissioner) are owned by us or our licensors. Team names, schedules, and game data belong to their respective owners and are used for identification only; we are not affiliated with, endorsed by, or sponsored by the NFL, any team, or any league.`] },
    { h: "8. Disclaimers", p: [`THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND. Game lines, scores, gradings, and standings may be delayed, inaccurate, or unavailable, and we do not warrant their accuracy. The Service is for entertainment and engagement only.`] },
    { h: "9. Limitation of liability", p: [`TO THE FULLEST EXTENT PERMITTED BY LAW, ${C} WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED THE GREATER OF THE AMOUNT THE RELEVANT ORGANIZATION PAID US IN THE PRIOR 12 MONTHS OR ONE HUNDRED U.S. DOLLARS ($100).`] },
    { h: "10. Indemnification", p: [`You agree to indemnify and hold harmless ${C} from claims arising out of your misuse of the Service or violation of these Terms or any law or third-party right.`] },
    { h: "11. Changes and termination", p: [`We may modify the Service or these Terms; material changes are posted with an updated effective date, and continued use means you accept them. We may suspend or end the Service or your access at any time.`] },
    { h: "12. Governing law", p: [`These Terms are governed by the laws of the State of ${LEGAL.state}, without regard to conflict-of-laws rules, and you consent to the jurisdiction of the state and federal courts located there.`] },
    { h: "13. Contact", p: [`${C}${LEGAL.address ? ` · ${LEGAL.address}` : ""} · ${LEGAL.email}`] },
  ]} />;
}
