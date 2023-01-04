using Carter;
using WeatherMonitoringServiceClient;

namespace ApiGateway.Features.Weather;

public class WeatherModule : ICarterModule
{
    private readonly WeatherMonitoringClient _weatherMonitor;

    public WeatherModule(WeatherMonitoringClient weatherMonitor)
    {
        _weatherMonitor = weatherMonitor;
    }

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/weather/current", async () =>
        {
            var result = await _weatherMonitor.GetCurrentWeather();
            return result == null ? Results.NotFound() : Results.Ok(result);
        });
    }
}
