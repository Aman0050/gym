import LegalLayout from '../../components/layouts/LegalLayout';
import useSEO from '../../hooks/useSEO';

const PrivacyPolicy = () => {
  useSEO({
    title: 'Privacy Policy',
    description: 'How FitXeno collects, protects, and processes information.',
    url: '/privacy'
  });

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: (
        <>
          <p>
            Welcome to FitXeno OS. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our 
            website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
          </p>
          <p>
            This Privacy Policy applies to all information collected through our Services (which, as described above, 
            includes our Website and Application), as well as any related services, sales, marketing, or events.
          </p>
        </>
      )
    },
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      content: (
        <>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the Services, 
            express an interest in obtaining information about us or our products and Services, when you participate 
            in activities on the Services, or otherwise when you contact us.
          </p>
        </>
      )
    },
    {
      id: 'account-information',
      title: 'Account Information',
      content: (
        <>
          <p>
            When you create an enterprise account, we require:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Business name and registration details</li>
            <li>Primary contact name and job title</li>
            <li>Business email address</li>
            <li>Business phone number</li>
            <li>Billing address and payment metadata (processed securely via our payment partners)</li>
          </ul>
        </>
      )
    },
    {
      id: 'member-information',
      title: 'Member Information',
      content: (
        <>
          <p>
            As a B2B SaaS platform, FitXeno acts as a Data Processor for the end-users (gym members) of our clients (gym owners). 
            Clients are the Data Controllers. Member data processed on behalf of our clients may include:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Names, addresses, and contact details</li>
            <li>Biometric or attendance tracking data (e.g., RFID or QR scans)</li>
            <li>Membership subscription details</li>
            <li>Health or physical fitness goals (if voluntarily provided via client configurations)</li>
          </ul>
        </>
      )
    },
    {
      id: 'technical-information',
      title: 'Technical Information',
      content: (
        <>
          <p>
            We automatically collect certain information when you visit, use or navigate the Services. 
            This information does not reveal your specific identity (like your name or contact information) 
            but may include device and usage information, such as your IP address, browser and device characteristics, 
            operating system, language preferences, referring URLs, device name, country, location, and information 
            about how and when you use our Services.
          </p>
        </>
      )
    },
    {
      id: 'how-we-use-information',
      title: 'How We Use Information',
      content: (
        <>
          <p>We use personal information collected via our Services for a variety of business purposes described below:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li><strong>To facilitate account creation and logon process.</strong></li>
            <li><strong>To provide and manage the core SaaS platform.</strong></li>
            <li><strong>To enforce our terms, conditions and policies.</strong></li>
            <li><strong>To respond to legal requests and prevent harm.</strong></li>
            <li><strong>To manage user accounts and provide enterprise support.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: (
        <>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect 
            the security of any personal information we process. Our database is hosted on enterprise-grade infrastructure 
            (Supabase / AWS) with strict Role-Level Security (RLS) policies ensuring tenant isolation.
          </p>
          <p>
            However, despite our safeguards and efforts to secure your information, no electronic transmission over the 
            Internet or information storage technology can be guaranteed to be 100% secure.
          </p>
        </>
      )
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      content: (
        <>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
          <p>We may process or share your data that we hold based on the following legal basis:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li><strong>Consent:</strong> We may process your data if you have given us specific consent.</li>
            <li><strong>Legitimate Interests:</strong> We may process your data when it is reasonably necessary to achieve our legitimate business interests.</li>
            <li><strong>Performance of a Contract:</strong> Where we have entered into a contract with you, we may process your personal information to fulfill the terms of our contract.</li>
          </ul>
        </>
      )
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: (
        <>
          <p>
            We will only keep your personal information for as long as it is necessary for the purposes set out in this 
            privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
          </p>
          <p>
            When we have no ongoing legitimate business need to process your personal information, we will either delete 
            or anonymize such information.
          </p>
        </>
      )
    },
    {
      id: 'user-rights',
      title: 'User Rights',
      content: (
        <>
          <p>
            Depending on your location (e.g., GDPR in Europe, CCPA in California), you may have specific rights regarding your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>The right to access and obtain a copy of your personal information.</li>
            <li>The right to request rectification or erasure of your data.</li>
            <li>The right to restrict the processing of your personal information.</li>
            <li>The right to data portability.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cookies-analytics',
      title: 'Cookies & Analytics',
      content: (
        <>
          <p>
            We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. 
            Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
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
            If you have questions or comments about this notice, you may email us at <strong>support@fitxeno.com</strong> or contact us by post at our corporate headquarters.
          </p>
        </>
      )
    }
  ];

  return (
    <LegalLayout 
      title="Privacy Policy"
      subtitle="How FitXeno collects, protects, and processes information."
      lastUpdated="October 1, 2024"
      sections={sections}
      contactEmail="support@fitxeno.com"
    />
  );
};

export default PrivacyPolicy;
