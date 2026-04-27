using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("modelo")]
    public class Modelo : BaseModel
    {
        [PrimaryKey("id_modelo", false)]
        [JsonPropertyName("ID_Modelo")]
        public int IdModelo { get; set; }

        [Column("id_marca")]
        [JsonPropertyName("ID_Marca")]
        public int IdMarca { get; set; }

        [Column("nombre_modelo")]
        [JsonPropertyName("Nombre_Modelo")]
        public string NombreModelo { get; set; } = string.Empty;

        [Column("tipo_transmision")]
        [JsonPropertyName("Tipo_Transmision")]
        public string TipoTransmision { get; set; } = string.Empty;
    }
}
