import React from 'react';
import {
  FileText,
  DollarSign,
  Calendar,
  Home,
  Briefcase,
  TrendingUp,
  Users,
  CheckCircle,
  Info,
  Building,
  Package,
  CreditCard,
  Percent,
  ShoppingCart,
  Truck,
  BarChart,
  PieChart,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings,
  AlertCircle,
  HelpCircle,
  Star,
  Award,
  Target,
  Zap,
  Activity,
  TrendingDown,
  Calculator,
  FileCheck,
  FilePlus,
  FileWarning,
  Folder,
  FolderOpen,
  Archive,
  BookOpen,
  Bookmark,
  Tag,
  Tags,
  Receipt,
  Wallet,
  BanknoteIcon as Banknote,
  CheckSquare,
  Clipboard,
  ClipboardList,
  UserCheck,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'file-text': FileText,
  'dollar-sign': DollarSign,
  'calendar': Calendar,
  'home': Home,
  'briefcase': Briefcase,
  'trending-up': TrendingUp,
  'users': Users,
  'check-circle': CheckCircle,
  'check-square': CheckSquare,
  'info': Info,
  'building': Building,
  'package': Package,
  'credit-card': CreditCard,
  'percent': Percent,
  'shopping-cart': ShoppingCart,
  'truck': Truck,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'clock': Clock,
  'mail': Mail,
  'phone': Phone,
  'map-pin': MapPin,
  'globe': Globe,
  'settings': Settings,
  'alert-circle': AlertCircle,
  'help-circle': HelpCircle,
  'star': Star,
  'award': Award,
  'target': Target,
  'zap': Zap,
  'activity': Activity,
  'trending-down': TrendingDown,
  'calculator': Calculator,
  'file-check': FileCheck,
  'file-plus': FilePlus,
  'file-warning': FileWarning,
  'folder': Folder,
  'folder-open': FolderOpen,
  'archive': Archive,
  'book-open': BookOpen,
  'bookmark': Bookmark,
  'tag': Tag,
  'tags': Tags,
  'receipt': Receipt,
  'wallet': Wallet,
  'banknote': Banknote,
  'clipboard': Clipboard,
  'clipboard-list': ClipboardList,
  'user-check': UserCheck,
};

interface IconProps {
  name?: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<IconProps> = ({ name, className = '', size = 16 }) => {
  if (!name) {
    return null;
  }

  const IconComponent = iconMap[name.toLowerCase()];

  if (!IconComponent) {
    console.warn(`[IconMapper] Icon "${name}" not found, using default FileText icon`);
    return <FileText className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

export const getIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) {
    return FileText;
  }

  const IconComponent = iconMap[iconName.toLowerCase()];

  if (!IconComponent) {
    console.warn(`[IconMapper] Icon "${iconName}" not found, returning default FileText icon`);
    return FileText;
  }

  return IconComponent;
};

// Field Icon Component for form field labels
export const FieldIcon: React.FC<IconProps> = ({ name, className = '', size = 16 }) => {
  if (!name) {
    return null;
  }

  const IconComponent = iconMap[name.toLowerCase()];

  if (!IconComponent) {
    // Don't render anything if icon not found (no fallback for field labels)
    return null;
  }

  return <IconComponent className={className} size={size} />;
};

export default DynamicIcon;
