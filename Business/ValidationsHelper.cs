using System;

namespace ProyectoRentaVehiculos.Business
{
    public static class ValidationsHelper
    {
        public static string Capitalizar(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return s;
            return char.ToUpper(s[0]) + s.Substring(1).ToLower();
        }
    }
}
