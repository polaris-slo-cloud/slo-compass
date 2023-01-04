using Microsoft.Extensions.Options;
using SmartIrrigation.Domain;

namespace ApiGateway.Features.Irrigation;

public class IrrigationService
{
    private readonly HttpClient _httpClient;

    public IrrigationService(IOptions<IrrigationServiceOptions> options)
    {
        _httpClient = new HttpClient();
        if (!string.IsNullOrEmpty(options.Value?.BaseUrl))
        {
            _httpClient.BaseAddress = new Uri(options.Value.BaseUrl);
        }
    }

    public async Task<IrrigationRecommendation?> GetRecommendation()
    {
        return await _httpClient.GetFromJsonAsync<IrrigationRecommendation>("api/recommendation");
    }
}

public class IrrigationServiceOptions
{
    public string BaseUrl { get; set; }
}
