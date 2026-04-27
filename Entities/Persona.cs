using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("persona")]
    public class Persona : BaseModel
    {
        [PrimaryKey("id_persona", false)]
        [JsonPropertyName("ID_Persona")]
        public int IdPersona { get; set; }

        [Column("id_ciudad")]
        [JsonPropertyName("ID_Ciudad")]
        public int IdCiudad { get; set; }

        [Column("cedula_persona")]
        [JsonPropertyName("Cedula_Persona")]
        public string CedulaPersona { get; set; } = string.Empty;

        [Column("nombre_persona")]
        [JsonPropertyName("Nombre_Persona")]
        public string NombrePersona { get; set; } = string.Empty;

        [Column("apellido_persona")]
        [JsonPropertyName("Apellido_Persona")]
        public string ApellidoPersona { get; set; } = string.Empty;

        [Column("f_nacimiento_persona")]
        [JsonPropertyName("F_Nacimiento_Persona")]
        public DateTime FNacimientoPersona { get; set; }

        [Column("direccion_persona")]
        [JsonPropertyName("Direccion_Persona")]
        public string DireccionPersona { get; set; } = string.Empty;

        [Column("telefono_persona")]
        [JsonPropertyName("Telefono_Persona")]
        public string TelefonoPersona { get; set; } = string.Empty;

        [Column("correo_persona")]
        [JsonPropertyName("Correo_Persona")]
        public string CorreoPersona { get; set; } = string.Empty;
    }
}
