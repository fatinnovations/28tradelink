import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DeliveryAddress } from "@/types/order";
import { malawiDistricts, districtTradePlaces } from "@/data/districts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useEffect } from "react";

const deliverySchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().min(10, "Enter a valid phone number").max(20, "Phone number too long"),
  district: z.string().min(1, "Select a district"),
  tradePlace: z.string().min(1, "Select a trade place"),
  area: z.string().trim().min(2, "Enter your area/village").max(100, "Area too long"),
  address: z.string().trim().min(5, "Enter delivery details").max(200, "Address too long"),
});

interface ShippingFormProps {
  onSubmit: (data: DeliveryAddress) => void;
  defaultValues?: Partial<DeliveryAddress>;
}

const ShippingForm = ({ onSubmit, defaultValues }: ShippingFormProps) => {
  const form = useForm<DeliveryAddress>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      fullName: defaultValues?.fullName || "",
      phone: defaultValues?.phone || "",
      district: defaultValues?.district || "",
      tradePlace: defaultValues?.tradePlace || "",
      area: defaultValues?.area || "",
      address: defaultValues?.address || "",
    },
  });

  const selectedDistrict = form.watch("district");
  const tradePlaces = selectedDistrict ? (districtTradePlaces[selectedDistrict] || []) : [];

  // Reset trade place when district changes
  useEffect(() => {
    if (selectedDistrict && !tradePlaces.includes(form.getValues("tradePlace"))) {
      form.setValue("tradePlace", "");
    }
  }, [selectedDistrict]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Banda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+265 999 123 456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your district" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {malawiDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tradePlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Popular Trade Place (Collection Point)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!selectedDistrict}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedDistrict ? "Select a trade place" : "Select district first"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tradePlaces.map((place) => (
                    <SelectItem key={place} value={place}>
                      {place}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area / Village</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Area 25, Chilomoni" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Details</FormLabel>
              <FormControl>
                <Input placeholder="Near the market, next to Shoprite" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button type="submit" className="w-full md:w-auto px-8">
            Continue to Payment
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ShippingForm;
