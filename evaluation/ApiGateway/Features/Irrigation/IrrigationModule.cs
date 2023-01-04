using Carter;

namespace ApiGateway.Features.Irrigation;

public class IrrigationModule : ICarterModule
{
    private readonly IrrigationService _service;

    public IrrigationModule(IrrigationService service)
    {
        _service = service;
    }

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/irrigation/recommendation", async () =>
        {
            var result = await _service.GetRecommendation();
            return result == null ? Results.NotFound() : Results.Ok(result);
        });
    }
}
