using ApiGateway.Features.Irrigation;
using ApiGateway.Features.Weather;
using Carter;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext());
// Add services to the container.
builder.Services.AddCarter();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddWeatherFeature(builder.Configuration);
builder.Services.AddIrrigationFeature(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    }
});

app.UseSerilogRequestLogging();

app.MapCarter();

app.Run();
