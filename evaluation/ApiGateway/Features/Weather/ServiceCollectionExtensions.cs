using WeatherMonitoringServiceClient;

namespace ApiGateway.Features.Weather;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddWeatherFeature(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddWeatherMonitoringClient(options => configuration.GetSection("WeatherMonitorService").Bind(options));
        return services;
    }
}
