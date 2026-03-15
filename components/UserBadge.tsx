import { Role } from '@/lib/types';

export default function UserBadge({ role }: { role: string }) {
  let bgColor = 'bg-gray-100 text-gray-800';
  
  switch (role as Role | 'pending') {
    case 'admin':
      bgColor = 'bg-red-100 text-red-800 border-red-200';
      break;
    case 'leader':
      bgColor = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'member':
      bgColor = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case 'stakeholder':
      bgColor = 'bg-gray-100 text-gray-800 border-gray-200';
      break;
    case 'pending':
      bgColor = 'bg-yellow-50 text-yellow-800 border-yellow-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgColor} capitalize`}>
      {role}
    </span>
  );
}
