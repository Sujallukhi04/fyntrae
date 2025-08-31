import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <>
      <section
        id="contact"
        className="relative  bg-black text-white flex flex-col gap-15 items-center justify-center pt-10 px-4"
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-4xl font-bold leading-[1.6] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Have a question or need help?
            </h2>
            <p className="text-md text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Feel free to reach out we’re here to help.
            </p>
          </motion.div>
        </div>
        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="bg-black/80 backdrop-blur-lg border border-white/10 text-white rounded-xl shadow-xl mb-10">
            <CardHeader className="pb-1">
              <CardTitle className="text-2xl font-bold text-blue-400">
                Contact Us
              </CardTitle>
              <p className="text-sm ">
                We're here to help you with any questions.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1 flex flex-col">
                  <label htmlFor="name" className="text-sm font-semibold">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1 flex flex-col pb-1.5">
                  <label htmlFor="message" className="text-sm font-semibold">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your query..."
                    rows={8}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </>
  );
};

export default Contact;
