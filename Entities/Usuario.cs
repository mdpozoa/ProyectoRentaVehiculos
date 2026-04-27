using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("usuario")]
    public class Usuario : BaseModel
    {
        [PrimaryKey("id_usuario", false)]
        [JsonPropertyName("ID_Usuario")]
        public int IdUsuario { get; set; }

        [Column("id_persona")]
        [JsonPropertyName("ID_Persona")]
        public int IdPersona { get; set; }

        [Column("user_usuario")]
        [JsonPropertyName("User_Usuario")]
        public string UserUsuario { get; set; } = string.Empty;

        [Column("pass_usuario")]
        [JsonPropertyName("Pass_Usuario")]
        public string PassUsuario { get; set; } = string.Empty;

        [Column("rol_usuario")]
        [JsonPropertyName("Rol_Usuario")]
        public string RolUsuario { get; set; } = string.Empty;

        [Column("fecha_usuario")]
        [JsonPropertyName("Fecha_Usuario")]
        public DateTime? FechaUsuario { get; set; }
    }
}
