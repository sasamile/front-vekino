import { getAxiosInstance } from "@/lib/axios-config";
import type {
  MetricsOverviewResponse,
  TenantsResponse,
  CondominiosByMonthResponse,
  PlanDistributionResponse,
  MRRGrowthResponse,
  CityDistributionResponse,
  AlertsResponse,
} from "@/types/types";

export async function getMetricsOverview(
  subdomain: string | null
): Promise<MetricsOverviewResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<MetricsOverviewResponse>(
    "/metrics/overview"
  );
  return response.data;
}

export async function getMetricsTenants(
  subdomain: string | null
): Promise<TenantsResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<TenantsResponse>("/metrics/tenants");
  return response.data;
}

export async function getCondominiosByMonth(
  subdomain: string | null
): Promise<CondominiosByMonthResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<CondominiosByMonthResponse>(
    "/metrics/condominios-by-month"
  );
  return response.data;
}

export async function getPlanDistribution(
  subdomain: string | null
): Promise<PlanDistributionResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<PlanDistributionResponse>(
    "/metrics/plan-distribution"
  );
  return response.data;
}

export async function getMRRGrowth(
  subdomain: string | null
): Promise<MRRGrowthResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<MRRGrowthResponse>(
    "/metrics/mrr-growth"
  );
  return response.data;
}

export async function getCityDistribution(
  subdomain: string | null
): Promise<CityDistributionResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<CityDistributionResponse>(
    "/metrics/city-distribution"
  );
  return response.data;
}

export async function getAlerts(
  subdomain: string | null
): Promise<AlertsResponse> {
  const axiosInstance = getAxiosInstance(subdomain);
  const response = await axiosInstance.get<AlertsResponse>("/metrics/alerts");
  return response.data;
}

