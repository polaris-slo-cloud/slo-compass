using Prometheus;
using Serilog;
using WeatherMonitoringService;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext());

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<CurrentWeatherService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseMetricServer();
app.UseHttpMetrics(options =>
{
    options.RequestDuration.Histogram = Metrics.CreateHistogram("http_request_duration_seconds", "The duration of HTTP requests processed by an ASP.NET Core application.", new HistogramConfiguration
    {
        Buckets = Histogram.PowersOfTenDividedBuckets(-2, 1, 4),
    });
});

app.MapGet("/api/current-weather", (CurrentWeatherService service) =>
{
    var currentWeather = service.GetCurrentWeather();
    return Results.Ok(currentWeather);
});
app.Run();
