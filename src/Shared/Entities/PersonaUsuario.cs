using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace Shared.Entities;

[Table("persona")]
public class Persona : BaseModel
{
    [PrimaryKey("id_persona", false)]
    [JsonPropertyName("ID_Persona")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdPersona { get; set; }

    [Column("id_ciudad")] [JsonPropertyName("ID_Ciudad")]
    public int IdCiudad { get; set; }

    [Column("cedula_persona")] [JsonPropertyName("Cedula_Persona")]
    public string CedulaPersona { get; set; } = string.Empty;

    [Column("nombre_persona")] [JsonPropertyName("Nombre_Persona")]
    public string NombrePersona { get; set; } = string.Empty;

    [Column("apellido_persona")] [JsonPropertyName("Apellido_Persona")]
    public string ApellidoPersona { get; set; } = string.Empty;

    [Column("f_nacimiento_persona")] [JsonPropertyName("F_Nacimiento_Persona")]
    public DateTime FNacimientoPersona { get; set; }

    [Column("direccion_persona")] [JsonPropertyName("Direccion_Persona")]
    public string DireccionPersona { get; set; } = string.Empty;

    [Column("telefono_persona")] [JsonPropertyName("Telefono_Persona")]
    public string TelefonoPersona { get; set; } = string.Empty;

    [Column("correo_persona")] [JsonPropertyName("Correo_Persona")]
    public string CorreoPersona { get; set; } = string.Empty;
}

[Table("usuario")]
public class Usuario : BaseModel
{
    [PrimaryKey("id_usuario", false)]
    [JsonPropertyName("ID_Usuario")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdUsuario { get; set; }

    [Column("id_persona")] [JsonPropertyName("ID_Persona")]
    public int IdPersona { get; set; }

    [Column("user_usuario")] [JsonPropertyName("User_Usuario")]
    public string UserUsuario { get; set; } = string.Empty;

    [Column("pass_usuario")] [JsonPropertyName("Pass_Usuario")]
    public string PassUsuario { get; set; } = string.Empty;

    [Column("rol_usuario")] [JsonPropertyName("Rol_Usuario")]
    public string RolUsuario { get; set; } = "Cliente";

    [Column("fecha_usuario")] [JsonPropertyName("Fecha_Usuario")]
    public DateTime? FechaUsuario { get; set; }
}
