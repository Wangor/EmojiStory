using System.Text.Json.Serialization;
using System.Runtime.Serialization;
using System.Collections.Generic;
using System.Text.Json;

namespace VideoRendererApi.Models;

public class Animation
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Fps { get; set; }
    public List<Scene> Scenes { get; set; } = new();
    public string? EmojiFont { get; set; }
}

public class Scene
{
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("duration_ms")]
    public int DurationMs { get; set; }

    [JsonPropertyName("backgroundActors")]
    public List<EmojiActor> BackgroundActors { get; set; } = new();
    public string? Caption { get; set; }
    public string? BackgroundColor { get; set; }
    public List<Actor> Actors { get; set; } = new();
    public List<Effect>? Effects { get; set; }
    public List<Sfx>? Sfx { get; set; }
}

public class Sfx
{
    [JsonPropertyName("at_ms")]
    public int AtMs { get; set; }
    public SfxType Type { get; set; }
}

[JsonConverter(typeof(EnumMemberJsonConverter<SfxType>))]
public enum SfxType
{
    [EnumMember(Value = "pop")] Pop,
    [EnumMember(Value = "whoosh")] Whoosh,
    [EnumMember(Value = "ding")] Ding
}

[JsonConverter(typeof(EnumMemberJsonConverter<Effect>))]
public enum Effect
{
    [EnumMember(Value = "fade-in")] FadeIn,
    [EnumMember(Value = "bounce")] Bounce
}

[JsonConverter(typeof(EnumMemberJsonConverter<LoopType>))]
public enum LoopType
{
    [EnumMember(Value = "float")] Float,
    [EnumMember(Value = "none")] None
}

[JsonConverter(typeof(EnumMemberJsonConverter<Ease>))]
public enum Ease
{
    [EnumMember(Value = "linear")] Linear,
    [EnumMember(Value = "easeIn")] EaseIn,
    [EnumMember(Value = "easeOut")] EaseOut,
    [EnumMember(Value = "easeInOut")] EaseInOut
}

public class Keyframe
{
    public double T { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public double? Rotate { get; set; }
    public double? Scale { get; set; }
    public Ease? Ease { get; set; }
}

public class ActorStart
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Scale { get; set; }
}

[JsonConverter(typeof(ActorConverter))]
public abstract class Actor
{
    public string Id { get; set; } = string.Empty;
    public abstract string Type { get; }
    public ActorStart? Start { get; set; }
    public List<Keyframe> Tracks { get; set; } = new();
    public LoopType? Loop { get; set; }
    public int? Z { get; set; }
    public List<Effect>? Effects { get; set; }
    public string? AriaLabel { get; set; }
}

public class EmojiActor : Actor
{
    public override string Type => "emoji";
    public string Emoji { get; set; } = string.Empty;
    public bool? FlipX { get; set; }
}

public class CompositeMeta
{
    public double? SizeOverride { get; set; }
}

public class CompositeActor : Actor
{
    public override string Type => "composite";
    public List<EmojiActor> Parts { get; set; } = new();
    public bool? FlipX { get; set; }
    public CompositeMeta? Meta { get; set; }
}

public class TextActor : Actor
{
    public override string Type => "text";
    public string Text { get; set; } = string.Empty;
    public string? Color { get; set; }
    public double? FontSize { get; set; }
}

public class ActorConverter : JsonConverter<Actor>
{
    public override Actor? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        if (!doc.RootElement.TryGetProperty("type", out var typeProp))
        {
            throw new JsonException("Missing type discriminator");
        }
        var type = typeProp.GetString();
        return type switch
        {
            "emoji" => doc.RootElement.Deserialize<EmojiActor>(options),
            "composite" => doc.RootElement.Deserialize<CompositeActor>(options),
            "text" => doc.RootElement.Deserialize<TextActor>(options),
            _ => throw new JsonException($"Unknown actor type '{type}'")
        };
    }

    public override void Write(Utf8JsonWriter writer, Actor value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, value.GetType(), options);
    }
}

