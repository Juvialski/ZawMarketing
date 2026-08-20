import { Campaign, MetricBadgeConfig } from '../types/campaign';

export function formatCurrency(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${value.toFixed(1)}%`;
}

export function getAvailableMetrics(campaign: Campaign): MetricBadgeConfig[] {
  const prop = campaign.sourceData.property;
  const fin = prop?.financials;
  const metrics: MetricBadgeConfig[] = [];

  if (fin?.purchasePrice) {
    metrics.push({
      id: 'purchase',
      label: 'PURCHASE PRICE',
      value: formatCurrency(fin.purchasePrice),
      subtext: prop?.squareFeet ? `$${Math.round(fin.purchasePrice / prop.squareFeet)}/SF` : undefined,
    });
  }

  if (fin?.renovationEstimate) {
    metrics.push({
      id: 'reno',
      label: 'EST. RENOVATION',
      value: formatCurrency(fin.renovationEstimate),
      subtext: 'Cosmetic Scope',
    });
  }

  if (fin?.arv) {
    metrics.push({
      id: 'arv',
      label: 'UNDERWRITTEN ARV',
      value: formatCurrency(fin.arv),
      subtext: prop?.squareFeet ? `$${Math.round(fin.arv / prop.squareFeet)}/SF` : undefined,
      highlight: true,
    });
  }

  if (fin?.equitySpread || (fin?.arv && fin?.purchasePrice)) {
    const spread = fin?.equitySpread || ((fin?.arv || 0) - (fin?.purchasePrice || 0) - (fin?.renovationEstimate || 0));
    metrics.push({
      id: 'spread',
      label: 'GROSS SPREAD',
      value: formatCurrency(spread),
      highlight: true,
    });
  }

  if (fin?.capRatePercent) {
    metrics.push({
      id: 'cap_rate',
      label: 'STABILIZED CAP',
      value: formatPercent(fin.capRatePercent),
      highlight: true,
    });
  }

  if (fin?.cashOnCashPercent) {
    metrics.push({
      id: 'cash_on_cash',
      label: 'CASH-ON-CASH',
      value: formatPercent(fin.cashOnCashPercent),
    });
  }

  if (prop?.bedrooms && prop?.bathrooms) {
    metrics.push({
      id: 'specs',
      label: 'CONFIGURATION',
      value: `${prop.bedrooms} Bed / ${prop.bathrooms} Bath`,
      subtext: prop.squareFeet ? `${formatNumber(prop.squareFeet)} Sq Ft` : undefined,
    });
  }

  if (prop?.squareFeet) {
    metrics.push({
      id: 'sqft',
      label: 'TOTAL AREA',
      value: `${formatNumber(prop.squareFeet)} SF`,
    });
  }

  if (prop?.propertyType === 'multi_family' && prop?.bedrooms) {
    metrics.push({
      id: 'doors',
      label: 'TOTAL DOORS',
      value: '8 Units',
      subtext: fin?.purchasePrice ? `$${formatNumber(Math.round(fin.purchasePrice / 8))}/door` : undefined,
    });
  }

  return metrics;
}
