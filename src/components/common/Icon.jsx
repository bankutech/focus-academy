import React from 'react';
import {
  Users,
  Clock,
  MapPin,
  BookOpen,
  ArrowRight,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  User,
  Phone,
  LogIn,
  UserPlus,
  Info,
  X,
  Filter,
  Calendar,
  Award,
  Send,
  MessageSquare,
  ChevronRight,
  Check
} from 'lucide-react';

const ICON_MAP = {
  users: Users,
  clock: Clock,
  mapPin: MapPin,
  bookOpen: BookOpen,
  arrowRight: ArrowRight,
  edit: Edit2,
  checkCircle: CheckCircle2,
  shieldCheck: ShieldCheck,
  user: User,
  phone: Phone,
  logIn: LogIn,
  userPlus: UserPlus,
  info: Info,
  close: X,
  filter: Filter,
  calendar: Calendar,
  award: Award,
  send: Send,
  messageSquare: MessageSquare,
  chevronRight: ChevronRight,
  check: Check
};

export default function Icon({ name, className = 'w-4 h-4', ...props }) {
  const Component = ICON_MAP[name];
  if (!Component) {
    return null;
  }
  return <Component className={className} {...props} />;
}
