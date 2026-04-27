using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("agencia")]
    public class Agencia : BaseModel
    {
        [PrimaryKey("id_agencia", false)]
        [JsonPropertyName("ID_Agencia")]
        public int IdAgencia { get; set; }

        [Column("id_ciudad")]
        [JsonPropertyName("ID_Ciudad")]
        public int IdCiudad { get; set; }

        [Column("nombre_agencia")]
        [JsonPropertyName("Nombre_Agencia")]
        public string NombreAgencia { get; set; } = string.Empty;

        [Column("direccion_agencia")]
        [JsonPropertyName("Direccion_Agencia")]
        public string DireccionAgencia { get; set; } = string.Empty;

        [Column("telefono_agencia")]
        [JsonPropertyName("Telefono_Agencia")]
        public string TelefonoAgencia { get; set; } = string.Empty;
    }
}
