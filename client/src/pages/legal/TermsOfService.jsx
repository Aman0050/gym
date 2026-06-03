import LegalLayout from '../../components/layouts/LegalLayout';
import useSEO from '../../hooks/useSEO';

const TermsOfService = () => {
  useSEO({
    title: 'Terms of Service',
    description: 'Rules and responsibilities governing the use of FitXeno.',
    url: '/terms'
  });

  const sections = [
    {
      id: 'acceptance-of-terms',
      title: 'Acceptance of Terms',
      content: (
        <>
          <p>
            By accessing or using FitXeno OS ("the Platform"), you agree to be bound by these Terms of Service. 
            If you disagree with any part of the terms, you may not access the Platform.
          </p>
          <p>
            These Terms of Service ("Terms") govern your use of our SaaS platform, website, and related services 
            operated by FitXeno Inc.
          </p>
        </>
      )
    },
    {
      id: 'platform-services',
      title: 'Platform Services',
      content: (
        <>
          <p>
            FitXeno provides a cloud-based operating system designed for modern gym and fitness center management. 
            Services include but are not limited to member management, billing, attendance tracking, and analytics.
          </p>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
          </p>
        </>
      )
    },
    {
      id: 'account-responsibilities',
      title: 'Account Responsibilities',
      content: (
        <>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>You are responsible for safeguarding your password.</li>
            <li>You agree not to disclose your password to any third party.</li>
            <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use.</li>
          </ul>
        </>
      )
    },
    {
      id: 'user-obligations',
      title: 'User Obligations',
      content: (
        <>
          <p>As a user of the Platform, you agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Use the Service for any illegal or unauthorized purpose.</li>
            <li>Attempt to hack, destabilize, or reverse engineer the Platform.</li>
            <li>Upload malicious code, viruses, or harmful scripts.</li>
            <li>Sell, resell, or exploit any portion of the Service without express written permission.</li>
          </ul>
        </>
      )
    },
    {
      id: 'subscription-billing',
      title: 'Subscription & Billing',
      content: (
        <>
          <p>
            FitXeno is a paid subscription service. By subscribing, you agree to pay the fees associated with 
            your chosen tier (e.g., Monthly, Annual).
          </p>
          <p>
            All payments are non-refundable unless otherwise explicitly stated in our Refund Policy. 
            Invoices are generated automatically and must be paid by the specified due date to avoid service interruption.
          </p>
        </>
      )
    },
    {
      id: 'free-trial-terms',
      title: 'Free Trial Terms',
      content: (
        <>
          <p>
            We may, at our sole discretion, offer a free trial for a limited period of time. 
            You may be required to enter your billing information in order to sign up for the free trial.
          </p>
          <p>
            If you do not cancel your subscription before the free trial expires, you will be automatically charged 
            for the chosen subscription period.
          </p>
        </>
      )
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content: (
        <>
          <p>
            The Platform and its original content, features, and functionality are and will remain the exclusive 
            property of FitXeno Inc. and its licensors. 
          </p>
          <p>
            Our trademarks and trade dress may not be used in connection with any product or service without the 
            prior written consent of FitXeno.
          </p>
        </>
      )
    },
    {
      id: 'data-ownership',
      title: 'Data Ownership',
      content: (
        <>
          <p>
            You retain all rights to the gym member data you upload and process through FitXeno. We do not claim 
            ownership over your specific business data.
          </p>
          <p>
            By using the Platform, you grant us a license to host, process, and backup your data strictly for 
            the purpose of providing you with the Service.
          </p>
        </>
      )
    },
    {
      id: 'limitation-of-liability',
      title: 'Limitation of Liability',
      content: (
        <>
          <p>
            In no event shall FitXeno, nor its directors, employees, partners, agents, suppliers, or affiliates, 
            be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
            loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </>
      )
    },
    {
      id: 'service-availability',
      title: 'Service Availability',
      content: (
        <>
          <p>
            We strive for 99.9% uptime. However, our Service may be interrupted for scheduled maintenance, updates, 
            or due to circumstances beyond our control (e.g., AWS outages). We are not liable for any downtime.
          </p>
        </>
      )
    },
    {
      id: 'account-suspension-termination',
      title: 'Account Suspension & Termination',
      content: (
        <>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason 
            whatsoever, including without limitation if you breach the Terms.
          </p>
          <p>
            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
            you may simply discontinue using the Service or contact support.
          </p>
        </>
      )
    },
    {
      id: 'governing-law',
      title: 'Governing Law',
      content: (
        <>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which FitXeno Inc. is registered, 
            without regard to its conflict of law provisions.
          </p>
        </>
      )
    },
    {
      id: 'contact-information',
      title: 'Contact Information',
      content: (
        <>
          <p>
            If you have any questions about these Terms, please contact us at <strong>contact@fitxeno.com</strong>.
          </p>
        </>
      )
    }
  ];

  return (
    <LegalLayout 
      title="Terms of Service"
      subtitle="Rules and responsibilities governing the use of FitXeno."
      lastUpdated="October 1, 2024"
      sections={sections}
      contactEmail="contact@fitxeno.com"
    />
  );
};

export default TermsOfService;
