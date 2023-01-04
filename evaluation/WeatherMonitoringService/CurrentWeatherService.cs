using SmartIrrigation.Domain;

namespace WeatherMonitoringService;

public class CurrentWeatherService
{
    private readonly List<Weather> _weatherPossibilities = new()
    {
        // Sunny and Dry
        new Weather(WeatherCondition.Sunny, 28.1, 20.7, 974, 0, 19.1),
        // Sunny with Humid Soil
        new Weather(WeatherCondition.Sunny, 27.3, 21.9, 982, 0, 60.1),
        // Cloudy
        new Weather(WeatherCondition.Cloudy, 19.8, 44.5, 979, 0, 45.2),
        // Rainy
        new Weather(WeatherCondition.Rain, 20.6, 80.5, 991, 15, 62.8),
    };

    public Weather GetCurrentWeather()
    {
        var random = new Random();
        var currentWeatherIndex = random.Next(_weatherPossibilities.Count - 1);
        return _weatherPossibilities[currentWeatherIndex];
    }
}
