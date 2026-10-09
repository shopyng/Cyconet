/**
 * Public verification alias for links opened on admin.cyconet.ng.
 *
 * The proxy rewrites /verify/<code> on the admin tenant to this internal path.
 * It deliberately stays outside `(app)`, so checking a certificate never asks
 * an employer or recruiter to sign in to the staff dashboard.
 */
export { default, metadata } from '@/app/(marketing)/verify/[code]/page';
