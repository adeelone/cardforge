import { lazy } from 'react';

/** Pages loaded on demand; rendered inside the shell's Suspense boundary. */
export const SettingsRoute = lazy(() => import('../routes/settings').then((module) => ({ default: module.SettingsRoute })));
export const TrustRoute = lazy(() => import('../routes/trust').then((module) => ({ default: module.TrustRoute })));
export const OrganizationsRoute = lazy(() => import('../routes/organizations').then((module) => ({ default: module.OrganizationsRoute })));
export const SharingRoute = lazy(() => import('../routes/sharing').then((module) => ({ default: module.SharingRoute })));
export const PrivacyRoute = lazy(() => import('../routes/info-pages').then((module) => ({ default: module.PrivacyRoute })));
export const TermsRoute = lazy(() => import('../routes/info-pages').then((module) => ({ default: module.TermsRoute })));
export const AccessibilityRoute = lazy(() => import('../routes/info-pages').then((module) => ({ default: module.AccessibilityRoute })));
export const HelpRoute = lazy(() => import('../routes/info-pages').then((module) => ({ default: module.HelpRoute })));
export const PricingRoute = lazy(() => import('../routes/pricing').then((module) => ({ default: module.PricingRoute })));
export const LoginRoute = lazy(() => import('../routes/login').then((module) => ({ default: module.LoginRoute })));
export const AccountRoute = lazy(() => import('../routes/account').then((module) => ({ default: module.AccountRoute })));
export const CheckoutRoute = lazy(() => import('../routes/checkout').then((module) => ({ default: module.CheckoutRoute })));
