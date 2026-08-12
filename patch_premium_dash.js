const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetState = `  // Premium State
  const [premiumEmail, setPremiumEmail] = useState('');
  const [premiumMonths, setPremiumMonths] = useState(1);
  const [premiumMsg, setPremiumMsg] = useState<{ text: string; isError?: boolean } | null>(null);`;

const newTargetState = `  // Premium State
  const [premiumEmail, setPremiumEmail] = useState('');
  const [premiumMonths, setPremiumMonths] = useState(1);
  const [premiumSearchQuery, setPremiumSearchQuery] = useState('');
  const [premiumMsg, setPremiumMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleUpdatePremiumDate = async (email: string, date: string) => {
    try {
      const timestamp = new Date(date).getTime();
      if (isNaN(timestamp)) return;
      const res = await fetch('/api/admin/premium/update-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({ email, timestamp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPremiumMsg({ text: data.message });
      onRefresh();
    } catch (err: any) {
      setPremiumMsg({ text: err.message, isError: true });
    }
  };`;

code = code.replace(targetState, newTargetState);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
