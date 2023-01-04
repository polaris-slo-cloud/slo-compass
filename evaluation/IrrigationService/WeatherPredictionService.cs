using Microsoft.Extensions.Options;

namespace IrrigationService;

public class WeatherPredictionService
{
    private readonly HttpClient _httpClient;

    public WeatherPredictionService(IOptions<WeatherPredictionOptions> options)
    {
        _httpClient = new HttpClient();
        if (!string.IsNullOrEmpty(options.Value?.BaseUrl))
        {
            _httpClient.BaseAddress = new Uri(options.Value.BaseUrl);
        }
    }

    public async Task<double?> PredictPrecipitation(DateTime timestampFrom, DateTime timestampTo)
    {
        var result = await _httpClient.GetAsync($"api/rain-prediction?timestampFrom={timestampFrom:O}&timestampTo={timestampTo:O}");
        if (!result.IsSuccessStatusCode)
        {
            return null;
        }
        
        var body = await result.Content.ReadAsStringAsync();
        return double.TryParse(body, out var predicted) ? predicted : null;
    }
}

public class WeatherPredictionOptions
{
    public string BaseUrl { get; set; }
}
