using Microsoft.Extensions.DependencyInjection;

namespace WeatherMonitoringServiceClient;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddWeatherMonitoringClient(this IServiceCollection services, Action<WeatherMonitorOptions> configureOptions)
    {
        services.AddSingleton<WeatherMonitoringClient>();
        services.Configure(configureOptions);
        return services;
    }
}
