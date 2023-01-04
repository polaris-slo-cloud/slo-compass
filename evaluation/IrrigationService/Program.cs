using IrrigationService;
using Serilog;
using SmartIrrigation.Domain;
using WeatherMonitoringServiceClient;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext());

// Add services to the container.
builder.Services.AddWeatherMonitoringClient(options => builder.Configuration.GetSection("WeatherMonitorService").Bind(options));
builder.Services.Configure<WeatherPredictionOptions>(options => builder.Configuration.GetSection("WeatherPredictionService").Bind(options));
builder.Services.AddSingleton<WeatherPredictionService>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();

app.MapGet("/api/recommendation",
  async (WeatherMonitoringClient weatherService, WeatherPredictionService predictionService) =>
  {
      var currentWeather = await weatherService.GetCurrentWeather();
      var precipitationPrediction = await predictionService.PredictPrecipitation(DateTime.UtcNow, DateTime.UtcNow.AddDays(1));

      if (currentWeather == null || !precipitationPrediction.HasValue)
      {
          return Results.Ok(new IrrigationRecommendation(DateTime.UtcNow));
      }
      
      var irrigationRecommendedOn = DateTime.UtcNow;
      // Thresholds do not follow any pattern. They have been randomly chosen to simulate a decision making
      if (currentWeather.SoilHumidity >= 70 || precipitationPrediction is >= 50) {
          irrigationRecommendedOn = DateTime.UtcNow.AddDays(7);
      } else if (currentWeather.SoilHumidity >= 60 || precipitationPrediction is >= 20) {
          irrigationRecommendedOn = DateTime.UtcNow.AddDays(5);
      } else if (currentWeather.SoilHumidity >= 45 || precipitationPrediction is >= 15) {
          irrigationRecommendedOn = DateTime.UtcNow.AddDays(3);
      } else if (precipitationPrediction is > 5) {
          irrigationRecommendedOn = DateTime.UtcNow.AddDays(1);
      }

      return Results.Ok(new IrrigationRecommendation(irrigationRecommendedOn));
  });

app.Run();
