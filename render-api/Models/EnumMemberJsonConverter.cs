using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace VideoRendererApi.Models;

public class EnumMemberJsonConverter<T> : JsonConverter<T> where T : struct, Enum
{
    private readonly Dictionary<string, T> _fromString;
    private readonly Dictionary<T, string> _toString;

    public EnumMemberJsonConverter()
    {
        _fromString = new Dictionary<string, T>(StringComparer.OrdinalIgnoreCase);
        _toString = new Dictionary<T, string>();
        foreach (var value in Enum.GetValues(typeof(T)).Cast<T>())
        {
            var name = value.ToString();
            var field = typeof(T).GetField(name);
            var enumMember = field?.GetCustomAttribute<EnumMemberAttribute>();
            var str = enumMember?.Value ?? name;
            _fromString[str] = value;
            _toString[value] = str;
        }
    }

    public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.String)
        {
            throw new JsonException($"Unexpected token parsing enum. Expected String, got {reader.TokenType}.");
        }
        var key = reader.GetString();
        if (key != null && _fromString.TryGetValue(key, out var value))
        {
            return value;
        }
        throw new JsonException($"Unknown value '{key}' for enum '{typeof(T).Name}'.");
    }

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        if (!_toString.TryGetValue(value, out var str))
        {
            str = value.ToString();
        }
        writer.WriteStringValue(str);
    }
}
