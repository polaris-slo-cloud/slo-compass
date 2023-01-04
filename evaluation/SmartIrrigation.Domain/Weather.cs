namespace SmartIrrigation.Domain;
public enum WeatherCondition
{
    Sunny,
    Cloudy,
    Snow,
    Rain,
}

public record Weather(WeatherCondition Condition, double Temperature, double Humidity, double PressureKpa, double Precipitation, double SoilHumidity);
