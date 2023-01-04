using ApiGateway.Features.Weather;

namespace ApiGateway.Features.Irrigation;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIrrigationFeature(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IrrigationService>();
        services.Configure<IrrigationServiceOptions>(options => configuration.GetSection("IrrigationService").Bind(options));
        return services;
    }
}
