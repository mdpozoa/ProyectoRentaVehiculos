using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("ciudad")]
    public class Ciudad : BaseModel
    {
        [PrimaryKey("id_ciudad", false)]
        [JsonPropertyName("ID_Ciudad")]
        public int IdCiudad { get; set; }

        [Column("nombre_ciudad")]
        [JsonPropertyName("Nombre_Ciudad")]
        public string NombreCiudad { get; set; } = string.Empty;

        [Column("provincia_ciudad")]
        [JsonPropertyName("Provincia_Ciudad")]
        public string ProvinciaCiudad { get; set; } = string.Empty;
    }
}
