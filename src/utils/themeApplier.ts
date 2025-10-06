import { TenantConfig } from './tenantService';

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const generateColorShades = (baseColor: string): Record<string, string> => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    return {};
  }

  const shades: Record<string, string> = {};

  const lightnessSteps = [
    { name: '50', factor: 0.95 },
    { name: '100', factor: 0.9 },
    { name: '200', factor: 0.75 },
    { name: '300', factor: 0.6 },
    { name: '400', factor: 0.4 },
    { name: '500', factor: 0.2 },
    { name: '600', factor: 0 },
    { name: '700', factor: -0.15 },
    { name: '800', factor: -0.3 },
    { name: '900', factor: -0.45 },
  ];

  shades['600'] = baseColor;

  shades['50'] = `rgb(${Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.95))}, ${Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.95))}, ${Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.95))})`;
  shades['100'] = `rgb(${Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.8))}, ${Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.8))}, ${Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.8))})`;
  shades['200'] = `rgb(${Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.6))}, ${Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.6))}, ${Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.6))})`;
  shades['300'] = `rgb(${Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.4))}, ${Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.4))}, ${Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.4))})`;
  shades['400'] = `rgb(${Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.2))}, ${Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.2))}, ${Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.2))})`;
  shades['700'] = `rgb(${Math.max(0, Math.round(rgb.r * 0.8))}, ${Math.max(0, Math.round(rgb.g * 0.8))}, ${Math.max(0, Math.round(rgb.b * 0.8))})`;
  shades['800'] = `rgb(${Math.max(0, Math.round(rgb.r * 0.6))}, ${Math.max(0, Math.round(rgb.g * 0.6))}, ${Math.max(0, Math.round(rgb.b * 0.6))})`;
  shades['900'] = `rgb(${Math.max(0, Math.round(rgb.r * 0.4))}, ${Math.max(0, Math.round(rgb.g * 0.4))}, ${Math.max(0, Math.round(rgb.b * 0.4))})`;

  return shades;
};

export const applyTheme = (tenant: TenantConfig): void => {
  const root = document.documentElement;

  root.style.setProperty('--tenant-firm-name', tenant.firmName);
  root.style.setProperty('--tenant-firm-tagline', tenant.firmTagline || '');

  const primaryShades = generateColorShades(tenant.primaryColor);
  Object.entries(primaryShades).forEach(([shade, color]) => {
    root.style.setProperty(`--tenant-primary-${shade}`, color);
  });

  const secondaryShades = generateColorShades(tenant.secondaryColor);
  Object.entries(secondaryShades).forEach(([shade, color]) => {
    root.style.setProperty(`--tenant-secondary-${shade}`, color);
  });

  if (tenant.logoUrl) {
    root.style.setProperty('--tenant-logo-url', `url(${tenant.logoUrl})`);
  }
};

export const resetTheme = (): void => {
  const root = document.documentElement;

  const properties = [
    '--tenant-firm-name',
    '--tenant-firm-tagline',
    '--tenant-logo-url',
  ];

  properties.forEach((prop) => root.style.removeProperty(prop));

  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  shades.forEach((shade) => {
    root.style.removeProperty(`--tenant-primary-${shade}`);
    root.style.removeProperty(`--tenant-secondary-${shade}`);
  });
};
