import LegalLayout from '../../components/layouts/LegalLayout';
import useSEO from '../../hooks/useSEO';

const RefundPolicy = () => {
  useSEO({
    title: 'Refund Policy',
    description: 'Understanding subscriptions, cancellations, and refunds.',
    url: '/refund-policy'
  });

  const sections = [
    {
      id: 'subscription-payments',
      title: 'Subscription Payments',
      content: (
        <>
          <p>
            FitXeno operates on a prepaid subscription model. Access to our enterprise SaaS platform requires 
            an active, paid subscription billed on a recurring basis. All fees are exclusive of all taxes, 
            levies, or duties imposed by taxing authorities.
          </p>
        </>
      )
    },
    {
      id: 'monthly-plans',
      title: 'Monthly Plans',
      content: (
        <>
          <p>
            For month-to-month subscriptions, you are billed in advance on a monthly basis. 
            <strong> Monthly subscription payments are non-refundable.</strong>
          </p>
          <p>
            If you cancel your monthly plan, you will retain access to the platform until the end of your 
            current billing cycle. We do not provide prorated refunds for partial months.
          </p>
        </>
      )
    },
    {
      id: 'annual-plans',
      title: 'Annual Plans',
      content: (
        <>
          <p>
            Annual subscriptions offer a significant discount in exchange for a one-year commitment. 
            If you cancel an annual plan within the first <strong>14 days</strong> of the initial purchase, 
            you are eligible for a full refund.
          </p>
          <p>
            After the 14-day window has passed, annual subscriptions become strictly non-refundable. 
            If you cancel after 14 days, your service will remain active until the end of your contracted year.
          </p>
        </>
      )
    },
    {
      id: 'free-trial-accounts',
      title: 'Free Trial Accounts',
      content: (
        <>
          <p>
            If you signed up for a Free Trial that requires a credit card, you will be billed automatically 
            at the end of the trial period unless you cancel beforehand. 
          </p>
          <p>
            Charges applied because a user forgot to cancel their free trial are generally non-refundable. 
            However, we may evaluate these situations on a case-by-case basis at our sole discretion.
          </p>
        </>
      )
    },
    {
      id: 'duplicate-charges',
      title: 'Duplicate Charges',
      content: (
        <>
          <p>
            In the rare event of a billing error resulting in a duplicate charge, please contact our support 
            team immediately. Verified duplicate charges will be refunded 100% to the original payment method 
            within 5-10 business days.
          </p>
        </>
      )
    },
    {
      id: 'billing-disputes',
      title: 'Billing Disputes',
      content: (
        <>
          <p>
            If you believe you have been billed in error, you must contact us within 30 days of the invoice date. 
            We will not review or refund disputed charges older than 30 days.
          </p>
          <p>
            Initiating a chargeback with your bank or credit card provider without contacting us first will result 
            in the immediate suspension of your FitXeno account pending an investigation.
          </p>
        </>
      )
    },
    {
      id: 'cancellation-policy',
      title: 'Cancellation Policy',
      content: (
        <>
          <p>
            You can cancel your subscription at any time directly through the Billing dashboard in your account, 
            or by contacting support. 
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Cancellations take effect at the end of the current billing cycle.</li>
            <li>No further charges will be made once a cancellation is confirmed.</li>
            <li>Your data will remain accessible in read-only mode for 30 days before being permanently deleted.</li>
          </ul>
        </>
      )
    },
    {
      id: 'refund-eligibility',
      title: 'Refund Eligibility',
      content: (
        <>
          <p>
            Refunds are generally <strong>NOT</strong> provided for:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Lack of usage or inactivity on the platform.</li>
            <li>Dissatisfaction after the 14-day annual refund window.</li>
            <li>Accounts terminated for violating our Terms of Service.</li>
          </ul>
        </>
      )
    },
    {
      id: 'contact-information',
      title: 'Contact Information',
      content: (
        <>
          <p>
            To request a refund or discuss a billing issue, please reach out to our billing department at <strong>support@fitxeno.com</strong>.
          </p>
        </>
      )
    }
  ];

  return (
    <LegalLayout 
      title="Refund Policy"
      subtitle="Understanding subscriptions, cancellations, and refunds."
      lastUpdated="October 1, 2024"
      sections={sections}
      contactEmail="support@fitxeno.com"
    />
  );
};

export default RefundPolicy;
