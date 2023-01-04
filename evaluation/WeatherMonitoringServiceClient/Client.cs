using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace WeatherMonitoringServiceClient;

public class WeatherMonitoringClient
{
    private readonly HttpClient _httpClient;

    public WeatherMonitoringClient(IOptions<WeatherMonitorOptions> options)
    {
        _httpClient = new HttpClient();
        if (!string.IsNullOrEmpty(options.Value?.BaseUrl))
        {
            _httpClient.BaseAddress = new Uri(options.Value.BaseUrl);
        }
    }

    public async Task<SmartIrrigation.Domain.Weather?> GetCurrentWeather()
    {
        return await _httpClient.GetFromJsonAsync<SmartIrrigation.Domain.Weather>("api/current-weather");
    }
}

public class WeatherMonitorOptions
{
    public string BaseUrl { get; set; }
}
